import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlacklistComponent } from './blacklist.component';

describe('BlacklistComponent', () => {
  let component: BlacklistComponent;
  let fixture: ComponentFixture<BlacklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlacklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlacklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
