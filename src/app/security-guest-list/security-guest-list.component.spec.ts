import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityGuestListComponent } from './security-guest-list.component';

describe('SecurityGuestListComponent', () => {
  let component: SecurityGuestListComponent;
  let fixture: ComponentFixture<SecurityGuestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityGuestListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityGuestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
